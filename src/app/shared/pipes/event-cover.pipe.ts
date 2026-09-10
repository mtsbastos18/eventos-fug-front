import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EventModel } from '../models/event';

/** Imagem exibida quando o evento não tem nenhuma capa cadastrada. */
export const EVENT_COVER_PLACEHOLDER =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

/**
 * Monta a URL da capa do evento a partir do storage.
 *
 * A variante 'mobile' (360x200) é usada no banner do celular e nos cards, em qualquer
 * tamanho de tela. Quando o evento não tem capa mobile, cai para a capa desktop (1920x400),
 * para que eventos cadastrados antes desse campo continuem exibindo imagem.
 */
@Pipe({
  name: 'eventCover',
  standalone: true,
})
export class EventCoverPipe implements PipeTransform {
  transform(
    event: EventModel | null | undefined,
    variant: 'desktop' | 'mobile' = 'desktop',
  ): string | null {
    if (!event) return null;

    const path =
      variant === 'mobile' ? event.mobile_image_path || event.image_path : event.image_path;

    return path ? environment.storageUrl + path : null;
  }
}
