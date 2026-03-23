import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// ── Posts ──────────────────────────────────────────────
export const getPosts = (params) => api.get('/posts', { params });
export const getPostBySlug = (slug) => api.get(`/posts/${slug}`);
export const createPost = (data) => api.post('/posts', data);
export const updatePost = (id, data) => api.put(`/posts/${id}`, data);
export const deletePost = (id) => api.delete(`/posts/${id}`);
export const addPostComment = (id, data) => api.post(`/posts/${id}/comments`, data);
export const deletePostComment = (id, commentId) => api.delete(`/posts/${id}/comments/${commentId}`);

// ── Articles ───────────────────────────────────────────
export const getArticles = (params) => api.get('/articles', { params });
export const getArticleBySlug = (slug) => api.get(`/articles/${slug}`);
export const createArticle = (data) => api.post('/articles', data);
export const updateArticle = (id, data) => api.put(`/articles/${id}`, data);
export const deleteArticle = (id) => api.delete(`/articles/${id}`);
export const addArticleComment = (id, data) => api.post(`/articles/${id}/comments`, data);
export const deleteArticleComment = (id, commentId) => api.delete(`/articles/${id}/comments/${commentId}`);

// ── Books ──────────────────────────────────────────────
export const getBooks = (params) => api.get('/books', { params });
export const getBookBySlug = (slug) => api.get(`/books/${slug}`);
export const createBook = (data) => api.post('/books', data);
export const updateBook = (id, data) => api.put(`/books/${id}`, data);
export const deleteBook = (id) => api.delete(`/books/${id}`);
export const addBookComment = (id, data) => api.post(`/books/${id}/comments`, data);
export const deleteBookComment = (id, commentId) => api.delete(`/books/${id}/comments/${commentId}`);

// ── Admin ──────────────────────────────────────────────
export const adminLogin = (email, password) => api.post('/admin/login', { email, password });

export default api;
