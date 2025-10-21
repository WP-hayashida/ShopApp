import * as React from "react";
import { ToastActionElement } from "./toast";

const TOAST_LIMIT = 1;

type State = {
  toasts: Toast[];
};

enum ActionTypes {
  ADD_TOAST,
  UPDATE_TOAST,
  DISMISS_TOAST,
  REMOVE_TOAST,
}

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type Action =
  | { type: ActionTypes.ADD_TOAST; toast: Toast }
  | { type: ActionTypes.UPDATE_TOAST; toast: Partial<Toast> }
  | { type: ActionTypes.DISMISS_TOAST; toastId?: string }
  | { type: ActionTypes.REMOVE_TOAST; toastId?: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ActionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case ActionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case ActionTypes.DISMISS_TOAST:
      const { toastId } = action;

      // ! Side effects ! - This means all toasts will be dismissed after a period of time
      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId ? { ...t, open: false } : t
          ),
        };
      }
      return {
        ...state,
        toasts: state.toasts.map((t) => ({ ...t, open: false })),
      };

    case ActionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

const listeners: ((state: State) => void)[] = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive";
};

export type ToastOptions = Omit<Toast, "id" | "open" | "onOpenChange">;

function toast({ ...props }: ToastOptions) {
  const id = genId();

  const update = (props: ToastOptions) =>
    dispatch({ type: ActionTypes.UPDATE_TOAST, toast: { id, ...props } });
  const dismiss = () =>
    dispatch({ type: ActionTypes.DISMISS_TOAST, toastId: id });
  const remove = () =>
    dispatch({ type: ActionTypes.REMOVE_TOAST, toastId: id });

  dispatch({
    type: ActionTypes.ADD_TOAST,
    toast: { id, open: true, ...props },
  });

  return {
    id: id,
    update,
    dismiss,
    remove,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: ActionTypes.DISMISS_TOAST, toastId }),
  };
}

export { toast, useToast };
