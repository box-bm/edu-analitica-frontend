import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
function App() {
  return (
    <div className="app-background">
      <div className="login-card">
        <div className="login-inner-border">
          
          <div className="login-header">
            <h1>EducAnalítica</h1>
            <p>Plataforma de aprendizaje básico</p>
          </div>

          <form className="login-form">
            <div className="input-group">
              <label>Usuario</label>
              <input type="text" placeholder="carné / correo / usuario" />
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <input type="password" placeholder="-------" />
            </div>

            <div className="role-group">
              <label>Rol de acceso</label>
              <div className="role-buttons">
                {/* La clase "active" resalta el botón seleccionado */}
                <button type="button" className="role-btn active">Estudiante</button>
                <button type="button" className="role-btn">Docente</button>
                <button type="button" className="role-btn">Admin</button>
              </div>
            </div>

            <button type="submit" className="submit-btn">Ingresar a la plataforma</button>
          </form>

        </div>
      </div>
    </div>
  )
}

export default App