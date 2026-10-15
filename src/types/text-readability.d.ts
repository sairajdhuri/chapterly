declare module "text-readability" {
  const readability: {
    fleschReadingEase(text: string): number;
    fleschKincaidGrade(text: string): number;
    syllableCount(text: string): number;
  };
  export default readability;
}
