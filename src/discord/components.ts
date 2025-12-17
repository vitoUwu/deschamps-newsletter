import {
  ButtonStyle,
  ComponentType,
  type APIActionRowComponent,
  type APIComponentInActionRow,
  type APIComponentInContainer,
  type APIMediaGalleryComponent,
  type APIMessageTopLevelComponent,
} from "discord-api-types/v10";

interface NewsletterComponentProps {
  body: string;
  slug: string;
  username: string;
  includeGoToTabnewsButton?: boolean;
  includeThumbnail?: boolean;
}

export function createNewsletterComponent(
  props: NewsletterComponentProps
): APIMessageTopLevelComponent {
  const {
    body,
    slug,
    username,
    includeGoToTabnewsButton = true,
    includeThumbnail = true,
  } = props;

  const button: APIActionRowComponent<APIComponentInActionRow> | undefined =
    includeGoToTabnewsButton
      ? {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              label: "Ver no Tabnews",
              url: `https://www.tabnews.com.br/${username}/${slug}`,
              style: ButtonStyle.Link,
            },
          ],
        }
      : undefined;

  const thumbnail: APIMediaGalleryComponent | undefined = includeThumbnail
    ? {
        type: ComponentType.MediaGallery,
        items: [
          {
            media: {
              url: `https://www.tabnews.com.br/api/v1/contents/${username}/${slug}/thumbnail`,
            },
          },
        ],
      }
    : undefined;

  return {
    type: ComponentType.Container,
    components: [
      thumbnail,
      {
        type: ComponentType.Separator,
      },
      {
        type: ComponentType.TextDisplay,
        content: body,
      },
      {
        type: ComponentType.Separator,
      },
      button,
    ].filter(Boolean) as APIComponentInContainer[],
  } as const;
}
