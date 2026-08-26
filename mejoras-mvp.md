# MVP IBVN HUB App

## Casos de uso

| N | Flujo |
| :--- | :--- |
| 1 | La predica del domingo se debe transformar a formato audio y almacenarla. Luego se debe transcribir con Whisper AI. |
| 2 | La transcripción se debe ingresar a un workflow de N8N y de acuerdo a un prompt (o skill) transformarla en formato devocional. El texto estructurado en formato devocional debe ingresar a la base de datos de la aplicación. |
| 3 | Una vez recibido el texto se gatilla una notificación push a la base de registrados para informar que el devocional está disponible. |

## Cambios en plataforma (backend)

| N | Tarea |
| :--- | :--- |
| 1 | Arreglar carga de foto de perfil. |
| 2 | Teléfono como campo obligatorio. |
| 3 | Crear eventos en la aplicación que permitan enviar notificaciones. |
| 4 | Setear modelo de opt-in de notificaciones por WhatsApp (booleano, fecha de consentimiento). |

## Cambios en plataforma (frontend)

| N | Tarea |
| :--- | :--- |
| 1 | Cambiar vista de login/registro para que pida teléfono obligatoriamente. |
| 2 | Ocultar sección de misiones. |
| 3 | Ocultar sección de escuela. |
| 4 | Ocultar sección de actividades. |
| 5 | Cambiar barra inferior por un sidebar a la izquierda (menú de hamburguesa). |
| 6 | Ajustar icono de la aplicación. |
| 7 | Arreglar texto de botones, colores de la aplicación. |
| 8 | Añadir temas de la iglesia. |
| 9 | Quitar botón de imprimir. |
| 10 | Agregar sección de notificaciones. |
| 11 | Añadir toggle en base a modelo de opt-in. |

## Next steps

- Ale pasará a Álvaro el formato de devocional.
- Álvaro bajará a Pato los cambios de front y backend.
- Álvaro revisará integración con N8N y OpenAI para procesamiento de predicas como devocionales.
- Revisión de avances según estimación de Pato.