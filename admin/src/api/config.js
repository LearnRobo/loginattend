// admin/src/api/config.js

const IS_PROD = import.meta.env.PROD;

// When hosting, replace the 'render-url' with your actual Render backend link
const PROD_URL = 'https://attendance-5seo.onrender.com'; 
const DEV_URL = 'http://192.168.88.251:5000';

export const BASE_URL = IS_PROD ? PROD_URL : DEV_URL;
export const API_BASE = `${BASE_URL}/api`;
export const UPLOADS_BASE = `${BASE_URL}/uploads/temp`;

export default API_BASE;
