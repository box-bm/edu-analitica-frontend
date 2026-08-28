const MOCK_USERS = [
  {
    Id: 1,
    Nombre: 'Estudiante Demo',
    Usuario: 'estudiante',
    Contraseña: '1234',
    Rol: 'Estudiante',
  },
  {
    Id: 2,
    Nombre: 'Docente Demo',
    Usuario: 'docente',
    Contraseña: '1234',
    Rol: 'Docente',
  },
  {
    Id: 3,
    Nombre: 'Admin Demo',
    Usuario: 'admin',
    Contraseña: '1234',
    Rol: 'Admin',
  },
];

class UserService {
  async login(credentials) {
    // Mock: simula una llamada al backend con una pequeña latencia
    await new Promise((resolve) => setTimeout(resolve, 400));

    const user = MOCK_USERS.find(
      (u) =>
        u.Usuario === credentials.user &&
        u.Contraseña === credentials.pass
    );

    if (!user) {
      return {
        success: false,
        error: 'Credenciales inválidas',
      };
    }

    return {
      success: true,
      data: { user },
    };
  }
}

export default new UserService();
