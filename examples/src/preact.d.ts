import JSX = preact.JSX
declare module '*.png'
declare module '*.gif'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.css'
declare module '*.scss' {
  const classes: { [key: string]: string }
  export default classes
}
