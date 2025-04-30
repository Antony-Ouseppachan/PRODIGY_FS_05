function linkHashtags(text) {
    return text.replace(/#(\w+)/g, '<a href="/posts/hashtag/$1">#$1</a>');
}

function toggleLike(postId) {
    fetch(`/toggle-like/${postId}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {

        const icon = document.getElementById(`thumb-${postId}`);
        icon.className = data.liked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up';
  
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
          allModals.forEach(function(otherModal) {
              if (otherModal !== modal) {
                  var bootstrapModal = bootstrap.Modal.getInstance(otherModal);
                  bootstrapModal.hide();
              }
          });
      });
  });

  document.getElementById('commentForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const comment = document.getElementById('commentInput').value;
  const postId = document.getElementById('postId').value;

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
          document.getElementById('commentInput').value = '';

          const commentsContainer = document.getElementById('commentsContainer');
          
          const newComment = document.createElement('div');
          newComment.innerHTML = `<strong>${data.username}</strong>: ${data.comment}`;

          commentsContainer.appendChild(newComment);

      } else {
          alert('Error posting comment');
      }
  })
  .catch(error => {
      console.error('Error posting comment:', error);
  });
});