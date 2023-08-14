// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Use middleware
app.use(bodyParser.json());
app.use(cors());

// Store comments data
const commentsByPostId = {};

// Route to handle POST request
app.post('/posts/:id/comments', async (req, res) => {
  // Get the id from the url
  const { id } = req.params;
  // Store the comment
  const comments = commentsByPostId[id] || [];
  // Get the comment from the request body
  const comment = req.body;
  // Create a new comment
  comments.push(comment);
  // Store the comment in the object
  commentsByPostId[id] = comments;

  // Send back the comment
  await axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: {
      id: comment.id,
      content: comment.content,
      postId: id,
      status: comment.status,
    },
  });

  // Send back the comment
  res.status(201).send(comments);
});

// Route to handle GET request
app.get('/posts/:id/comments', (req, res) => {
  // Get the id from the url
  const { id } = req.params;
  // Send back the comments
  res.send(commentsByPostId[id] || []);
});

// Route to handle POST request from the event bus
app.post('/events', async (req, res) => {
  console.log('Event Received:', req.body.type);

  const { type, data } = req.body;

  // Check if the event type is CommentModerated
  if (type === 'CommentModerated') {
    // Get the id and status from the data
    const { postId, id, status, content } = data;
    // Get the comments from the object
    const comments = commentsByPostId[postId];
    // Find the comment with the id
    const comment = comments.find((comment) => {
      return comment.id === id;
    });
    // Update the status
    comment.status = status;

    // Send back the event to the event bus
    await axios.post('http://localhost:4005/events', {
      type: 'CommentUpdated',
      data: {
        id,
        postId