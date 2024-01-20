import fs from 'fs';
import path from 'path';

const files = fs.readdirSync(path.join(process.cwd(), './'));

export default function DateStatic() {
  return (
    <div style={{ border: '3px green dashed', margin: '1em', padding: '1em' }}>
      <p>Executing Node.js code ({new Date().toDateString()})</p>
      <p>{files.join(' ')}</p>
    </div>
  );
}
