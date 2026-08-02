import React from 'react';
import RegisterForm from '../../components/RegisterForm';

export default function RegisterOwnerScreen() {
  return (
    <RegisterForm
      role="owner"
      title="Registracija ugostitelja"
      subtitle="Prvi mjesec besplatno! Dodaj svoj objekt, meni i primaj rezervacije."
      nazivLabel="Naziv obrta/firme"
    />
  );
}
