import { useLayoutEffect, useState } from 'react';
import debounce from 'lodash/debounce';

const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const updateSize = (): void => {
      setIsMobile(window.innerWidth < 968);
    };
    // window.addEventListener('resize', debounce(updateSize, 250));
    updateSize();
    return (): void => window.removeEventListener('resize', updateSize);
  }, [window]);

  return isMobile;
};

export default useIsMobile;