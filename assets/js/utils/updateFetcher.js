export function updateCheck(){

function isOnline() {
  return navigator ? navigator.onLine : false;
}
	
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
    throw error;
  }
}

async function getLatestReleaseWithInternetCheck(username, repo) {
  try {
    const online = isOnline();

    if (!online) {
      throw new Error("No internet connection");
    }

    const latestRelease = await getLatestRelease(username, repo);
    return latestRelease;
  } catch (error) {
   // console.error("Error:", error.message);
    // You can handle the error further or throw it to let the calling code handle it
    throw error;
  }
}
	
const username = 'MarketingPipeline';
const repo = 'Termino.js';



getLatestReleaseWithInternetCheck(username, repo)
  .then((latestRelease) => {
    const latest_version = latestRelease.tagName.replace("v", "")
    if(latest_version != version){
    showUpdateModal(latestRelease, latest_version)	  
    }
    //console.log("Latest Release:", latestRelease);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });


}


function showUpdateModal(latestRelease, latest_version){

openModal('New version available! 🚀', `
    <p class="mb-4">
    It appears you are using ${version}, feel free to update now to version: ${latest_version}. Released on ${latestRelease.releaseDate.split("T")[0]}.  
    </p>
 <!-- Save and Cancel buttons -->
<div class="flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4">
    <a href="${latestRelease.url}" class="maia-button maia-button-primary">
        <button class="w-full md:w-auto inline-flex items-center justify-center font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 h-10 text-white text-lg md:text-xl p-2 md:p-4 rounded-lg bg-green-500">
           View Latest Release
        </button>
    </a>
    <button onclick="hideModal()" class="w-full md:w-auto inline-flex items-center justify-center font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-300 h-10 text-white text-lg md:text-xl p-2 md:p-4 rounded-lg bg-gray-500">
        No, I'll update later
    </button>
</div>


`, 'You can report an issue on GitHub by clicking');
}
