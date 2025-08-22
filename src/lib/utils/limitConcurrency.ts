export async function limitConcurrency<T>(
  pool: number,
  tasks: (() => Promise<T>)[]
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  return new Promise((resolve, reject) => {
    let active = 0;

    const next = () => {
      if (index >= tasks.length && active === 0) return resolve(results);
      while (active < pool && index < tasks.length) {
        const currentIndex = index++;
        active++;
        tasks[currentIndex]()
          .then(res => results[currentIndex] = res)
          .catch(err => results[currentIndex] = err) // errores parciales
          .finally(() => {
            active--;
            next();
          });
      }
    };

    next();
  });
}