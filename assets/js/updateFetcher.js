async function getLatestRelease(username, repo) {
  try {
    const apiUrl = `https://api.github.com/repos/${username}/${repo}/releases/latest`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data. Status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      tagName: data.tag_name,
      releaseName: data.name,
      releaseDate: data.published_at,
      url: data.html_url,
    };
  } catch (error) {
    console.error("Error:", error.message);
    // You can handle the error further or throw it to let the calling code handle it
    throw error;
  }
}

function isOnline() {
  return navigator ? navigator.onLine : false;
}
