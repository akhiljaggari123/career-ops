import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const models = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // dummy
// Actually use the listModels method
// ... but easier to just try gemini-1.5-flash without 'latest' or 'v1beta' issues if the SDK handles it.
