export default function TestPage() {
  console.log('✅ [DEBUG] Pagina [locale]/page.tsx s-a încărcat cu succes!');
  
  return (
    <div style={{ 
      padding: '100px', 
      fontSize: '48px', 
      textAlign: 'center',
      background: '#0a0a0a',
      color: 'white',
      minHeight: '100vh'
    }}>
      ✅ QRate.MD - Test Page
      <br />
      <span style={{ fontSize: '24px', color: '#888' }}>
        Dacă vezi asta → pagina funcționează!
      </span>
    </div>
  );
}