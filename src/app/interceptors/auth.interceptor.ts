import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    console.log('Interceptor - Token:', token ? token.substring(0, 50) + '...' : 'No token');
    console.log('Interceptor - Request URL:', req.url);

    if (token) {
      const cloned = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      console.log('Interceptor - Authorization header agregado');
      return next.handle(cloned);
    }

    console.log('Interceptor - Sin token, request sin modificar');
    return next.handle(req);
  }
}
