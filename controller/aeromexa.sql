CREATE DATABASE IF NOT EXISTS aeromexa;
use aeromexa;

CREATE TABLE usuarios(
id_usuario INT PRIMARY KEY AUTO_INCREMENT,
nombre varchar(55),
apellido varchar(100),
usuario varchar(100),
correo varchar(100),
cont varchar(255)
);

INSERT INTO usuarios(nombre, apellido, usuario, correo, cont) VALUES
('Angel','Villa','AngelVR', 'villaangel305@gmail.com','tck01nzaj');

SELECT cont FROM usuarios WHERE correo = 'villaangel305@gmail.co' OR usuario = 'AngelVR';

