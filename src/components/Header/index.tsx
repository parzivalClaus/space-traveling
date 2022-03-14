/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import Link from 'next/link';
import Image from 'next/image';

import commonStyles from '../../styles/common.module.scss';
import styles from './header.module.scss';

export default function Header() {
  return (
    <header>
      <div className={commonStyles.wrapper}>
        <nav className={styles.navContent}>
          <Link href="/">
            <a href="/">
              <Image
                src="/logo.png"
                alt="logo"
                width="238.62px"
                height="25.63px"
              />
            </a>
          </Link>
        </nav>
      </div>
    </header>
  );
}
