export default function NotFound() {
	return (
		<main
			style={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				textAlign: 'center',
				padding: '2rem',
			}}
		>
			<h1 style={{ fontSize: '6rem', margin: 0 }}>404</h1>
			<h2>Página no encontrada</h2>
			<p>Lo sentimos, la página que buscas no existe.</p>
			<a href="/">Volver al inicio</a>
		</main>
	)
}
