
# 🦖 ROXTOR Intelligent ERP v1.5

Sistema de gestión operativa textil con **Vozify AI** (Simulador de Notas de Voz) y **Radar AI** (Escaneo de Ventas).

## 🚀 Guía de Despliegue: Netlify + Supabase

Sigue este orden exacto para tener el sistema funcionando en menos de 5 minutos:

### 1. Preparar la Base de Datos (Supabase)
1. Entra en [Supabase](https://supabase.com) y crea un proyecto.
2. Ve al **SQL Editor** (icono `>_`) y ejecuta este comando:
   ```sql
   create table roxtor_sync (
     store_id text primary key,
     last_sync timestamp with time zone default now(),
     payload jsonb
   );
   ```
3. Ve a **Settings > API** y copia:
   - `Project URL`
   - `anon public key`

### 2. Desplegar la Interfaz (Netlify)
1. Sube tu código a un repositorio de **GitHub**.
2. En [Netlify](https://app.netlify.com), pulsa **"Add new site" > "Import from Git"**.
3. Selecciona tu repo. Netlify detectará que es un proyecto de Vite.
4. **Configura las Variables de Entorno (CRÍTICO):**
   - Ve a **Site configuration > Environment variables**.
   - Añade `API_KEY`: Pega tu clave de [Google Gemini](https://aistudio.google.com).
5. Pulsa **"Deploy site"**.

### 3. Conectar los puntos (Configuración Final)
1. Abre tu URL de Netlify.
2. Entra con el PIN inicial: `0000`.
3. Ve a **Gerencia** (PIN Maestro: `1234`).
4. Ve a **Ajustes de Marca > Conexión Nube**:
   - Activa el interruptor.
   - Pega la URL y la Anon Key de Supabase.
   - Pulsa **"Probar Conexión"**.

---

## 🔒 Seguridad
- **PIN Acceso App:** `0000` (Cámbialo en Ajustes inmediatamente).
- **PIN Gerencia:** `1234` (Cámbialo en Ajustes inmediatamente).

## 🎙️ Vozify AI: Notas de Voz de WhatsApp
Este módulo permite a los agentes practicar o generar respuestas de audio. La IA conoce:
- Precios (Detal y Mayor).
- Reglas de abono (50% obligatorio).
- Políticas de no devolución.
- Tiempo de entrega de la sede.
