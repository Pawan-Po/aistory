
export interface StoryPageData {
  text: string;
  sceneDescription: string; // May not be needed by frontend display, but good for data structure
  imageUri: string;
}

export interface StoryData {
  title: string;
  characterDescription: string;
  characterName: string;
  originalCharacterUri: string; // The base character image, styled but not in a specific scene
  coverImageUri: string;
  pages: StoryPageData[];
}
