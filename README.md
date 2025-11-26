# 🎾 Padel v1.0  

Aplicación **Fullstack** desarrollada con:  

- **Frontend:** Angular + CSS  
- **Backend:** NestJS  
- **Base de datos:** MySQL  

---

## Cómo levantar el proyecto

## 1- Clonar repositorio

```bash
git clone https://github.com/XAcademy-e-2-mayo-25/Padel-Client.git
cd Padel-Client
```

## 2- Cambiar a la rama de frontend

```bash
git checkout frontend/home
```

## 3- Instalar dependencias

```bash
npm install
```

## 4- Levantar el servidor de desarrollo

```bash
ng serve --open
```

### Por defecto, se abrirá en: <http://localhost:4200/>

## Requisitos

Node.js: >= 18 (se recomienda v20+)

npm: incluido con Node.js

Angular CLI

```bash
npm install -g @angular/cli
```

## Comandos útiles

### Verificar versión de Angular y dependencias

```bash
ng version

```

### Generar un nuevo componente

```bash
ng generate component nombre-componente
```

### Generar un nuevo servicio

```bash
ng generate service nombre-servicio
```

### Compilar para producción

```bash
ng build --configuration production
```

# RAMAS

## 1- Antes de hacer commits, asegúrate de estar en la rama correcta:

```bash
git status

```

### 2- Crear una rama (desde master)

### Situarte en master y traer los últimos cambios:

```bash
git checkout master
git pull origin master
```

## 3- Crear la rama y moverte a ella:

```bash
git checkout -b nombre-rama
# (alternativa moderna) git switch -c nombre-rama
```

## 4- Reemplazá nombre-rama por algo descriptivo, p.ej. feature/mi-cambio o fix/login-error.

## Subir la rama al remoto y establecer el upstream (para poder hacer git push/git pull fácilmente):

```bash
git push -u origin nombre-rama
```

## 5- Trabajar, commitear y pushear normalmente:

```bash
git add .
git commit -m "Mensaje corto y claro"
git push
```

## 6- Eliminar la rama cuando ya no se use

### Antes: asegurate de que la rama fue mergeada a master (o que realmente querés borrarla).

## 7- Volver a master y actualizar:

```bash
git checkout master
git pull origin master
```

### (Opcional) Ver qué ramas ya están fusionadas en master:

```bash
git branch --merged master
```

## 8- Borrar la rama local:

```bash
git branch -d nombre-rama   # usa -d si está mergeada
# o, si querés forzar el borrado aunque no esté mergeada:
git branch -D nombre-rama
```

## 9- Borrar la rama remota en GitHub:

```bash
git push origin --delete nombre-rama
```

## 10- Limpiar referencias remotas obsoletas en tu local:

```bash
git fetch --prune
# o: git remote prune origin
``` 

# Comandos útiles para comprobar

### Ver ramas locales: git branch

### Ver ramas remotas: git branch -r

### Ver todas: git branch -a

### Nota importante

### No podés borrar la rama en la que estás parado: cambiate a otra (ej. master) antes.

Si la rama está protegida en GitHub (branch protection), GitHub no te permitirá borrarla desde remoto hasta que se quite la protección o tengas permisos suficientes.

Si querés, te doy una línea que hace local+remoto (cambiate primero a master):

```bash
git checkout master && git pull origin master && git branch -d nombre-rama && git

```

