export const getImage = (imgUrl: string) => new URL(`/src/assets/images/${imgUrl}`, import.meta.url).href
