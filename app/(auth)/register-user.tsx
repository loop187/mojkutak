import React from 'react';
import RegisterForm from '../../components/RegisterForm';

export default function RegisterUserScreen() {
  return (
    <RegisterForm
      role="user"
      title="Registracija gosta"
      subtitle="Pronađi objekte, rezerviraj stol i prati omiljene lokale — besplatno!"
      nazivLabel="Ime i prezime"
    />
  );
}
