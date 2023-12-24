export async function fetchAndParseTemplates() {
  try {
    // Fetch the content of "templates.txt" file
    const response = await fetch('./templates.txt');

    // Check if the response is successful (status code 200)
    if (!response.ok) {
      throw new Error(`Failed to fetch templates. Status: ${response.status}`);
    }

    // Read the content as text
    const fileContent = await response.text();

    // Split the content into an array of options
    const templateOptions = fileContent.split('\n').map(option => option.trim());

    return templateOptions;
  } catch (error) {
    // Handle errors, e.g., network error or file not found
    throw new Error('Error fetching or parsing templates: ' + error.message);
  }
}
