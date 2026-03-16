/// <reference types="vite/client" />

declare module "*.scss?url" {
  const content: string;
  export default content;
}

declare module "*.css?url" {
  const content: string;
  export default content;
}
