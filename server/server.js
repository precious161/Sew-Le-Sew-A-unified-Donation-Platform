import app from './src/app.js';
import { config } from './src/config/env.js';

const PORT= process.env.PORT;

app.listen(PORT,()=>{
  console.log(`Server listening on http://localhost:${config.port}`);
})