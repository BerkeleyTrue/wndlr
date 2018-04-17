import ReactDOM from 'react-dom';
import { Observable } from 'rxjs';

// render(
//   element: ReactComponent,
//   DomContainer: DOMNode
// ) => Observable[RootInstance]

export default function render(element, DOMContainer) {
  return Observable.create(observer => {
    try {
      ReactDOM.render(element, DOMContainer, function() {
        observer.next(this);
      });
    } catch (e) {
      return observer.error(e);
    }

    return () => ReactDOM.unmountComponentAtNode(DOMContainer);
  });
}
