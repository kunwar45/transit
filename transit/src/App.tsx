import Map from './map'

export default function App() {
  return (
    <div
      style={{
        position: 'relative',
        height: '100vh',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <Map />
      <p>Hello World</p>
    </div>
  );
}
