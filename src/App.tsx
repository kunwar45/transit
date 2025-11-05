import Map from './Map'

export default function App() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '800px',
          height: '500px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Map width={800} height={500} />
      </div>
      <p style={{ marginTop: '12px', fontSize: '14px', color: '#HHH' }}>ottawa</p>  
    </div>
  );
}
