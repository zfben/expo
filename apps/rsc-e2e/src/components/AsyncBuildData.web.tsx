export default async function DateStatic() {
    // Fetch from a mock API
    const res = await fetch('https://jsonplaceholder.typicode.com/todos/1').then((res) => res.json());
  
    return (
      <div style={{ border: '3px orange dashed', padding: '1em' }}>
        <p>Async data fetching ({new Date().toDateString()})</p>
  
        <p>{JSON.stringify(res)}</p>
      </div>
    );
  }