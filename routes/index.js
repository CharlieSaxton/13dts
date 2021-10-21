const { WSAECONNREFUSED } = require('constants');
var express = require('express');
var router = express.Router();
var dbPool = require('../db');

function imageCheck(result){
  result.rows.forEach(word => {
    const fs = require('fs')
    const path = './public/images/' + word.english + '.jpg'
    try {
        if (fs.existsSync(path)) {
          word.image = '/images/' + word.english + '.jpg'
        } else {
        word.image = '/images/noimage.jpg'
        }
      } catch(err) {
        word.image = '/images/noimage.jpg'
      }
  });
  return result
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let categoryQuery = "select category_name from categorys";
  let categoryResult = await dbPool.query(categoryQuery);
  let wordQuery = "select maori, english, definition, id from words";
  let wordResult = await dbPool.query(wordQuery);
  wordResult.filter = "All words";
  wordResult = imageCheck(wordResult);
  let result = {};
  result.wordResult = wordResult;
  result.categoryResult = categoryResult;
  result.loggedIn = req.session.loggedin;
  result.loggedInUser = req.session.username;
  console.log(result)
  res.render('index', result);
});

router.get('/category/:categoryName', async function(req, res, next) {
  let query = "select maori, english, definition, id from words where lower(category) = lower($1)";
  let values = [req.params.categoryName];
  let wordResult = await dbPool.query(query, values);
  wordResult.filter = req.params.categoryName;
  wordResult = imageCheck(wordResult);
  let result = {};
  result.wordResult = wordResult;
  result.loggedIn = req.session.loggedin;
  result.loggedInUser = req.session.username;
  res.render('index', result);
});


router.get('/word/:wordId', async function(req, res, next) {
  let query = "select maori, english, id, definition, category, author, vocab_level, created_at from words where id = $1";
  let values = [req.params.wordId];
  let result = await dbPool.query(query, values);
  result = imageCheck(result)
  let category = result.rows[0].category;
  query = "select maori, english, definition, id from words where lower(category) = lower($1)"
  let additionalWords =  await dbPool.query(query, [category]);
  result.rows[0].additionalWords = imageCheck(additionalWords);
  result.loggedIn = req.session.loggedin;
  result.loggedInUser = req.session.username;
  res.render('word-info', result);
});


router.get('/deleteword/:wordId', async function(req, res, next) {
  if(req.session.loggedin){
    let query = "DELETE FROM words WHERE id = $1;"
    let values = [req.params.wordId];
    let result = await dbPool.query(query, values);
    res.redirect('/');
  }else{
    res.redirect('/');
  }
});

router.get('/search', async function(req, res, next) {
  let query = "select maori, english, definition, id from words where lower(maori) like lower($1) or lower(english) like lower($1)";
  let values = [req.query.word + '%'];
  let result = await dbPool.query(query, values);
  result.filter = "Search: " + req.query.word;
  result = imageCheck(result);
  result.loggedIn = req.session.loggedin;
  result.loggedInUser = req.session.username;
  res.render('index', result);
});

router.get('/login', async function(req, res, next) {
  res.render('login', {error: false});
});
router.get('/add-word', async function(req, res, next) {
  let categoryQuery = "select category_name from categorys";
  let categoryResult = await dbPool.query(categoryQuery);
  let result = {
    categoryResult: categoryResult,
    loggedIn: req.session.loggedin,
    loggedInUser: req.session.username
  }
  if(result.loggedIn){
    res.render('add-word', result);
  }else{
    res.redirect('/');
  }
});
router.post('/auth', async function(request, res) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
    let query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
    let values = [username, password];
    let result = await dbPool.query(query, values);
    if (result.rows.length > 0) {
      request.session.loggedin = true;
      request.session.username = username;
      res.redirect('/');
    } else {
      res.render('login', {error: true});
    }			
	} else {
		res.render('login', {error: true});
	}
});


router.post('/post-word', async function(req, res, response) {
  let query = 'INSERT INTO words (maori, english, definition, category, vocab_level, author) VALUES ($1, $2, $3, $4, $5, $6) returning id;';
  let values = [req.body.maori, req.body.english, req.body.definition, req.body.category, req.body.level, req.session.username];
  let result = await dbPool.query(query, values);
  res.redirect('/word/' + result.rows[0].id);
});

router.post('/post-category', async function(req, res, response) {
  console.log("here")
  let query = 'INSERT INTO categorys (category_name) VALUES ($1);';
  let values = [req.body.categoryName];
  let result = await dbPool.query(query, values);
  res.redirect('/');
});



module.exports = router;
