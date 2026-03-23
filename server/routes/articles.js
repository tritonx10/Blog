const express = require('express');
const router = express.Router();
const { getAllArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle, addComment } = require('../controllers/articleController');

router.get('/', getAllArticles);
router.get('/:slug', getArticleBySlug);
router.post('/', createArticle);
router.put('/:id', updateArticle);
router.delete('/:id', deleteArticle);
router.post('/:id/comments', addComment);

module.exports = router;
