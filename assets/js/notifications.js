    async function showNotification(type, title, message) {
      const container = document.getElementById('notification-container');

      // Create notification element
      const notification = document.createElement('div');
      notification.className = `bg-${type}-100 border-l-4 border-${type}-500 text-${type}-700 p-4`;
      notification.setAttribute('role', 'alert');

      // Create title element
      const titleElement = document.createElement('p');
      titleElement.className = 'font-bold';
      titleElement.innerText = title;

      // Create message element
      const messageElement = document.createElement('p');
      messageElement.innerText = message;

      // Append title and message to notification
      notification.appendChild(titleElement);
      notification.appendChild(messageElement);

      // Append notification to container
      container.appendChild(notification);

      // Wait for a moment, then remove the notification
      await new Promise(resolve => setTimeout(resolve, 5000)); // Adjust the timeout as needed

      // Remove notification after the delay
      container.removeChild(notification);
    }
