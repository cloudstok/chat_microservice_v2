export const getRandomAvatarIndex = (id: string): number => {
    let sum = 0;
    for (const char of id) {
        sum += char.charCodeAt(0);
    }
    return (sum % 72) + 1;
}