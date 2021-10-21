//requring modules
const { WSAECONNREFUSED } = require('constants');
var express = require('express');
var router = express.Router();
var dbPool = require('../db');

//checking if word has an image attached taht exists and returning a result
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

// GET home page
router.get('/', async function(req, res, next) {
  //getting all catergory names from categorys table
  let categoryQuery = "select category_name from categorys";
  let categoryResult = await dbPool.query(categoryQuery);
  //getting all words in words table and returning nessasary data
  let wordQuery = "select maori, english, definition, id from words";
  let wordResult = await dbPool.query(wordQuery);
  wordResult.filter = "All words";
  //checking words for images
  wordResult = imageCheck(wordResult);
  let result = {};
  result.wordResult = wordResult;
  result.categoryResult = categoryResult;
  //checking if user is logged in
  result.loggedIn = req.session.loggedin;
  result.loggedInUser = req.session.username;
  //rendering page with result object attached to template
  res.render('index', result);
});

// GET selected category
router.get('/category/:categoryName', async function(req, res, next) {
  //selecting all words with correct category attached
  let query = "select maori, english, definition, id from words where lower(category) = lower($1)";
  let values = [req.params.categoryName];
  //passing in selected category name
  let wordResult = await dbPool.query(query, values);
  wordResult.filter = req.params.categoryName;
  wordResult = imageCheck(wordResult);
  let result = {};
  result.wordResult = wordResult;
  //checking if user is logged in
  result.loggedIn = req.session.loggedin;
  result.loggedInUser = req.session.username;
  //rendering page with result object attached to template
  res.render('index', result);
});

// GET selected word
router.get('/word/:wordId', async function(req, res, next) {
  //getting word based off word id and returning all data attached to the word
  let query = "select maori, english, id, definition, category, author, vocab_level, created_at from words where id = $1";
  let values = [req.params.wordId];
  //passing in word string
  let result = await dbPool.query(query, values);
  //finding image of the word
  result = imageCheck(result)
  let category = result.rows[0].category;
  //finding words with same categories and returning revelant data
  query = "select maori, english, definition, id from words where lower(category) = lower($1)"
  let additionalWords =  await dbPool.query(query, [category]);
  //checking all additional words for images
  result.rows[0].additionalWords = imageCheck(additionalWords);
  //checking if user is logged in
  result.loggedIn = req.session.loggedin;
  result.loggedInUser = req.session.username;
  //rendering page with result object attached to template
  res.render('word-info', result);
});

// DELETE word
router.get('/deleteword/:wordId', async function(req, res, next) {
  //checking if logged in
  if(req.session.loggedin){
    //deleting word
    let query = "DELETE FROM words WHERE id = $1;"
    //passing in word id
    let values = [req.params.wordId];
    await dbPool.query(query, values);
    //redirecting to home page
    res.redirect('/');
  }else{
    res.redirect('/');
  }
});

// SEARCH words
router.get('/search', async function(req, res, next) {
  //selecting all similar words to search input result ad returning relevant data
  let query = "select maori, english, definition, id from words where lower(maori) like lower($1) or lower(english) like lower($1)";
  let values = [req.query.word + '%'];
  let wordResult = await dbPool.query(query, values);
  let result = {}
  result.wordResult = wordResult
  //setting title of page to search result
  result.filter = "Search: " + req.query.word;
  //finding image of the words
  result.wordResult = imageCheck(result.wordResult);
  //checking if user is logged in
  result.loggedIn = req.session.loggedin;
  result.loggedInUser = req.session.username;
  //rendering page with result object attached to template
  res.render('index', result);
});

// GET log in page
router.get('/login', async function(req, res, next) {
  //rendering log in page
  res.render('login', {error: false});
});

// GET add word page
router.get('/add-word', async function(req, res, next) {
  //getting all categories from table
  let categoryQuery = "select category_name from categorys";
  let categoryResult = await dbPool.query(categoryQuery);
  //formating result object
  let result = {
    categoryResult: categoryResult,
    loggedIn: req.session.loggedin,
    loggedInUser: req.session.username
  }
  //checking if user is logged in
  if(result.loggedIn){
    //rendering add word page
    res.render('add-word', result);
  }else{
    res.redirect('/');
  }
});

// POST auth
router.post('/auth', async function(request, res) {
  //getting username and password from form
	var username = request.body.username;
	var password = request.body.password;
  //checking if username and password exist
	if (username && password) {
    //getting user based off username and password
    let query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
    let values = [username, password];
    let result = await dbPool.query(query, values);
    //checking is username exists
    if (result.rows.length > 0) {
      //logging user in
      request.session.loggedin = true;
      request.session.username = username;
      //redirecting to home
      res.redirect('/');
    } else {
      //displaying error message
      res.render('login', {error: true});
    }			
	} else {
    //displaying error message
		res.render('login', {error: true});
	}
});

// POST word
router.post('/post-word', async function(req, res, response) {
  //posting word to words table in database with relevent infomation attached and returning id
  let query = 'INSERT INTO words (maori, english, definition, category, vocab_level, author) VALUES ($1, $2, $3, $4, $5, $6) returning id;';
  //passing in form data
  let values = [req.body.maori, req.body.english, req.body.definition, req.body.category, req.body.level, req.session.username];
  let result = await dbPool.query(query, values);
  //using returned id to redirected to the word that has been added
  res.redirect('/word/' + result.rows[0].id);
});

// POST category
router.post('/post-category', async function(req, res, response) {
  //posting category into categorys table
  let query = 'INSERT INTO categorys (category_name) VALUES ($1);';
  //passing in form data
  let values = [req.body.categoryName];
  await dbPool.query(query, values);
  //redirecting to home page
  res.redirect('/');
});

module.exports = router;