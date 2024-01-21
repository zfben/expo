import { View, Text } from 'react-native';

export default async function DateStatic() {
  // Fetch from a mock API
  const res = await fetch('https://jsonplaceholder.typicode.com/todos/1').then((res) => res.json());

  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'orange',
        borderStyle: 'dashed',
        
        padding: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>Server Component</Text>

      <Text>Async data fetching ({new Date().toDateString()})</Text>

      <Text>{JSON.stringify(res)}</Text>
    </View>
  );
}
// export default async function DateStatic() {
//   // Fetch from a mock API
//   const res = await fetch('https://jsonplaceholder.typicode.com/todos/1').then((res) => res.json());

//   return (
//     <div style={{ border: '3px orange dashed', margin: '1em', padding: '1em' }}>
//       <p>Async data fetching ({new Date().toDateString()})</p>

//       <p>{JSON.stringify(res)}</p>
//     </div>
//   );
// }
