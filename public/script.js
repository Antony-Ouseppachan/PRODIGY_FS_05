function linkHashtags(text) {
    return text.replace(/#(\w+)/g, '<a href="/posts/hashtag/$1">#$1</a>');
}

function toggleLike(postId) {
    fetch(`/toggle-like/${postId}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        // Update thumb icon style
        const icon = document.getElementById(`thumb-${postId}`);
        icon.className = data.liked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up';
  
        // Refresh like count
        fetch(`/like-count/${postId}`)
          .then(res => res.json())
          .then(data => {
            document.getElementById(`count-${postId}`).innerText = data.likeCount;
          });
      });
  }

  var allModals = document.querySelectorAll('.modal');

  allModals.forEach(function(modal) {
      modal.addEventListener('shown.bs.modal', function () {
          // Close any other open modal when a new one opens
          allModals.forEach(function(otherModal) {
              if (otherModal !== modal) {
                  var bootstrapModal = bootstrap.Modal.getInstance(otherModal);
                  bootstrapModal.hide();
              }
          });
      });
  });

  document.getElementById('commentForm').addEventListener('submit', function (e) {
  e.preventDefault();  // Prevent the form from submitting normally

  const comment = document.getElementById('commentInput').value;
  const postId = document.getElementById('postId').value;

  // Send the comment to the server using Fetch API
  fetch('/comment', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ postId, comment })
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          // Clear the input field after submission
          document.getElementById('commentInput').value = '';

          // Append the new comment to the comments container
          const commentsContainer = document.getElementById('commentsContainer');
          
          const newComment = document.createElement('div');
          newComment.innerHTML = `<strong>${data.username}</strong>: ${data.comment}`; // Display new comment

          commentsContainer.appendChild(newComment);

          // Optionally, you can update the comments list (data.comments) if needed
          // to show the full updated list.
      } else {
          alert('Error posting comment');
      }
  })
  .catch(error => {
      console.error('Error posting comment:', error);
  });
});