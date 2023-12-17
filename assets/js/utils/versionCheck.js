export function validateVersion(version) {
    // Split the version string using dot as a delimiter
    const versionNumbers = version.split('.');

    // Extract the first number from the version string
    const firstNumber = parseInt(versionNumbers[0]);

    // Check if the first number is 1
    if (firstNumber === 1) {
        return {error:false}
    } else if (firstNumber > 1) {
        return {error:'Menu Version is too high. You need to upgrade your software to open this menu.'}
    } else {
        return {error:'Menu Version is too low. You need to downgrade your software to open this menu.'}
    }
}
