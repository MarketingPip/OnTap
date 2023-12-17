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

async function getLatestReleaseWithInternetCheck(username, repo) {
  try {
    const online = await isOnline();

    if (!online) {
      throw new Error("No internet connection");
    }

    const latestRelease = await getLatestRelease(username, repo);
    return latestRelease;
  } catch (error) {
    console.error("Error:", error.message);
    // You can handle the error further or throw it to let the calling code handle it
    throw error;
  }
}


const username = 'MarketingPipeline';
const repo = 'Termino.js';

let currentVersion = 1

getLatestReleaseWithInternetCheck(username, repo)
  .then((latestRelease) => {
    const latest_version = latestRelease.tagName.replace("v", "")
    if(latest_version != "1.0.0"){
      console.log(`New version available! 🚀 It appears you are using ${currentVersion}, feel free to update now to version: ${latest_version}. Released on ${latestRelease.releaseDate.split("T")[0]}`)
    }
    console.log("Latest Release:", latestRelease);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
