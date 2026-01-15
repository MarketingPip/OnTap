// Function to remove the loader element from the DOM and show content
export function removeLoader(isHomePage = false) {
    const loader = document.getElementById('page-loader');
    if (!loader) {
        console.error("Error: #page-loader element not found!");
        return;
    }

    // Add opacity transition class to trigger fade-out effect
    loader.classList.add('opacity-0');

    // Set a timeout that matches the duration of the fade-out animation (3150ms)
    setTimeout(() => {
        // Set the opacity to 0 to ensure it's visually removed
        loader.style.opacity = 0;

        // Remove the active class from the body
        document.body.classList.remove('page-loader-active');

        // If it's the home page, trigger the update check
        if (isHomePage) {
            updateCheck();
        }

        // Remove the loader element from the DOM
        loader.parentNode.removeChild(loader);

    }, 3150); // Ensure this matches your CSS transition duration for smooth fading
}
