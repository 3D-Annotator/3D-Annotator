import binascii

from typing import Optional, Tuple, Any

from django.contrib.auth.base_user import AbstractBaseUser
from knox.auth import TokenAuthentication as KnoxTokenAuthentication, compare_digest
from knox.crypto import hash_token
from knox.models import AuthToken
from knox.settings import CONSTANTS, knox_settings

from rest_framework.authentication import BasicAuthentication as RestBasicAuthentication
from rest_framework import exceptions

from django.contrib.auth import authenticate, get_user_model
from django.utils.translation import gettext_lazy as _

from rest_framework.request import Request


# BasicAuthentication with custom error codes
class BasicAuthentication(RestBasicAuthentication):
    def authenticate_credentials(
        self, userid: str, password: str, request: Optional[Request] = None
    ) -> Tuple[AbstractBaseUser, None]:
        """
        Authenticate the userid and password against username and password
        with optional request for context.
        """
        credentials = {get_user_model().USERNAME_FIELD: userid, "password": password}
        user = authenticate(request=request, **credentials)

        if user is None:
            raise exceptions.AuthenticationFailed(
                detail="Invalid username/password.", code="invalid_credentials"
            )

        if not user.is_active:  # pragma: no cover
            raise exceptions.AuthenticationFailed(_("User inactive or deleted."))

        return (user, None)


# TokenAuthentication with custom error codes
class TokenAuthentication(KnoxTokenAuthentication):
    def authenticate_credentials(self, token: bytes) -> Tuple[Any, AbstractBaseUser]:
        """
        Due to the random nature of hashing a value, this must inspect
        each auth_token individually to find the correct one.

        Tokens that have expired will be deleted and skipped
        """
        msg = _("Invalid token.")
        token_decoded = token.decode("utf-8")
        for auth_token in AuthToken.objects.filter(
            token_key=token_decoded[: CONSTANTS.TOKEN_KEY_LENGTH]
        ):
            if self._cleanup_token(auth_token):
                continue  # pragma: no cover

            try:
                digest = hash_token(token_decoded)
            except (TypeError, binascii.Error):  # pragma: no cover
                raise exceptions.AuthenticationFailed(msg)
            if compare_digest(digest, auth_token.digest):  # pragma: no cover
                if knox_settings.AUTO_REFRESH and auth_token.expiry:  # pragma: no cover
                    self.renew_token(auth_token)
                return self.validate_user(auth_token)
        raise exceptions.AuthenticationFailed(
            code="not_logged_in", detail="The token is either expired or invalid."
        )
