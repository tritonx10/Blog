const Post = require('../models/Post');
const Article = require('../models/Article');
const Book = require('../models/Book');

const MODELS = {
  posts: Post,
  articles: Article,
  books: Book
};

const db = {
  find: async (collection) => {
    const Model = MODELS[collection];
    return await Model.find({}).sort({ createdAt: -1 });
  },
  
  findOne: async (collection, predicate) => {
    // Note: predicate is a function in the old version, but we'll try to find by slug first
    // In our controllers, it's usually (a => a.slug === req.params.slug)
    // We'll just fetch all and find, OR improve controllers later.
    // For now, let's keep it compatible.
    const Model = MODELS[collection];
    const items = await Model.find({});
    return items.find(predicate);
  },
  
  findById: async (collection, id) => {
    const Model = MODELS[collection];
    return await Model.findById(id);
  },

  create: async (collection, newItem) => {
    const Model = MODELS[collection];
    const item = new Model(newItem);
    return await item.save();
  },

  update: async (collection, id, updateData) => {
    const Model = MODELS[collection];
    return await Model.findByIdAndUpdate(id, updateData, { new: true });
  },

  delete: async (collection, id) => {
    const Model = MODELS[collection];
    const result = await Model.findByIdAndDelete(id);
    return !!result;
  }
};

module.exports = db;
