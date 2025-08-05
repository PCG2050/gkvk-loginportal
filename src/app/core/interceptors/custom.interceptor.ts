import { HttpInterceptorFn } from '@angular/common/http';


export const customInterceptor: HttpInterceptorFn = (req, next) => {
  const logData = localStorage.getItem("authtoken");
  if(logData != null)
  {
  const tokenData = JSON.parse(logData);
  
  const newrequestData = req.clone({
    setHeaders:
    {
      Authorization:`Bearer ${tokenData}`
    }
  })
  return next(newrequestData);
  }else{
    return next(req);
  }
  
 
};
