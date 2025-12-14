import { CloseButton } from "./reusableComponents/CloseButton";
import s from "./DrawerView.module.css";

type DrawerViewProps = {
  setIsDrawerOpen: (isOpen: boolean) => void;
  date?: string;
};

export const DrawerView = ({ setIsDrawerOpen, date }: DrawerViewProps) => {
  return (
    <div className={s.drawerView}>
      <CloseButton onClick={() => setIsDrawerOpen(false)} />
      <div>{date}</div>
      <div>Drawer View Component</div>
    </div>
  );
};
