import styles from '@/src/utils/style'
import React from 'react'
import NavItems from '../NavItems'
import ProfileDropDown from '../ProfileDropDown'

function Header() {
  return (
    <div>
      <header className='w-full h-[80px] bg-[#0F1523]'>
        <div className="w-[90%] m-auto flex items-center justify-between">
          <h1 className={`${styles.logo}`}>
            becodemy
          </h1>
          <NavItems/>
          <ProfileDropDown/>
        </div>
      </header>
    </div>
  )
}

export default Header
