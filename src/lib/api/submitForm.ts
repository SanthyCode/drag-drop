export async function submitForm(data: {
  title: string;
  description: string;
  files: { id: string; name: string; size: number; type: string; url?: string }[];
}) {
  await new Promise((res) => setTimeout(res, 1000));
  console.log('Formulario enviado:', data);
  return { ok: true };
}