const express = require('express');
const router = express.Router();
const { getAllBooks, getBookBySlug, getBookChapters, createBook, updateBook, deleteBook, addComment, deleteComment } = require('../controllers/bookController');

router.get('/', getAllBooks);
router.get('/:slug', getBookBySlug);
router.get('/:id/chapters', getBookChapters);
router.post('/', createBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);
router.post('/:id/comments', addComment);
router.delete('/:id/comments/:commentId', deleteComment);

module.exports = router;
